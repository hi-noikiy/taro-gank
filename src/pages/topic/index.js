import Taro, { Component } from '@tarojs/taro'
import { View, Text, Picker, Button, Image, ScrollView } from '@tarojs/components'
import { AtSwipeAction, AtMessage } from "taro-ui"
import './style.less'
import Api from '../../utils/api'
import Unique from '../../utils/unique'

export default class Topic extends Component {

  config = {
    navigationBarTitleText: '推荐'
  };

  constructor(props) {
    super(props);
    this.state = {
      dataList: [],
      selectorChecked: '',
      loading: true,
      item: {},
      category: [],
      storageArray: []
    }
  }

  componentDidMount () {
    this.getHistory();

    // save array
    Taro.getStorage({key: 'collect'}).then(res => {
      if(res.data.length) {
        this.setState({
          storageArray: JSON.parse(res.data)
        })
      }else {
        this.setState({
          storageArray: res.data
        })
      }
    }).catch(err => {
      console.log('err', err);
    });
  }

  // get history data
  getHistory() {
    Api.request({url:'day/history'}).then(res => {
        const {data} = res;
        this.setState({
          dataList: data.results,
          selectorChecked: data.results[0]
        });
        this.getData(data.results[0]);
    })
  }

  // get content data
  getData = (value) => {
    Taro.showLoading({ title: '加载中' });
    Api.request({url: `day/${value.split("-").join("\/")}`}).then(res => {  // string to array to string
      const { data } = res;
      Taro.hideLoading();
      this.setState({
        item: data.results,
        loading: false,
        category: data.category
      })
    })
  };

  // switch date
  onChange = e => {
    const { dataList} = this.state; // slice dataList before 74 a data, because some of the images don't show
    this.setState({
      selectorChecked: dataList[e.detail.value]
    });
    this.getData(dataList[e.detail.value]);
  };

  // open detail
  handleDetail = (item) => {
    Taro.navigateTo({
      url: `/pages/detail/index?item=${JSON.stringify(item)}`
    })
  };

  getMessage = (message, type) => {
    Taro.atMessage({
      'message': message,
      'type': type,
    })
  };
  // open or close button
  onCollection = (item) => {
    const { storageArray } = this.state;
    // management data
    if(storageArray.length === 0) {
      storageArray.push(item);
      this.getMessage('收藏成功', 'success')
    }else {
      storageArray.map(d => {
        if(d._id === item._id) {
          this.getMessage('请勿重复收藏', 'error');
          return false
        }else {
          storageArray.push(item);
          this.getMessage('收藏成功', 'success')
        }
      })
    }
    Taro.setStorageSync('collect', JSON.stringify(Unique(storageArray)));
  };

  render () {
    const { dataList, selectorChecked, item, loading, category } = this.state;
    return (
      <View className='container'>
        <AtMessage />
        {!loading && JSON.stringify(item) !== "{}" &&
        <ScrollView
          scrollY
          scrollWithAnimation
          scrollTop='0'
          style='height: 100%'
        >
            <View className='title'>
              <Image className='title-img' src={item['福利'][0].url} mode='widthFix' />
            </View>
            <View className='page-section'>
              <View>
                <Picker mode='selector' range={dataList.slice(0, 74)} onChange={this.onChange}>
                  <View className='picker'>
                    <View className='header'>
                      <Text>{selectorChecked}</Text>
                      <Button type='primary'>切换日期</Button>
                    </View>
                  </View>
                </Picker>
              </View>
            </View>
            {category.length && category.map((d, i) =>
              <View key={i} className='section'>
                  <View className='section-title'>
                    {d}
                  </View>
                  <View className='section-content'>
                    {item[d].map((v, index) =>
                      <View className='section-list' key={v._id}>
                        <AtSwipeAction onClick={this.onCollection.bind(this, v)} autoClose options={[
                          {
                            text: '收藏',
                            style: {
                              backgroundColor: '#FF4949'
                            }
                          }
                        ]}
                        >
                          <Text onClick={this.handleDetail.bind(this, v)}>{index + 1}. {v.desc}</Text>
                        </AtSwipeAction>
                      </View>
                    )}
                  </View>
              </View>
            )}
        </ScrollView>
        }
      </View>
    )
  }
}

